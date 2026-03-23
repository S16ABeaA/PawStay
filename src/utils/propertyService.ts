import supabase from '@/config/supabaseClient'
import { PropertySubmissionData } from '@/pages/user/ListProperty/types/submission_types/propertySubmissionData'
import imageCompression from 'browser-image-compression'

export interface PropertySubmissionResponse {
  success: boolean
  applicationId?: number
  message?: string
  error?: string
}

export class PropertyService {
  private static readonly CONFIGURED_BACKEND_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_AUTH_API_URL ||
    'http://localhost:5001'

  private static readonly BACKEND_BASE_URLS = Array.from(
    new Set(
      [
        this.CONFIGURED_BACKEND_BASE_URL,
        'http://localhost:5001',
      ].filter((url): url is string => Boolean(url)),
    ),
  )

  private static readonly SUBMIT_PROPERTY_PATH = '/api/submit-property'

  private static async compressImage(file: File): Promise<File> {
    if (!file.type.startsWith('image/')) return file

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: 'image/jpeg',
      })
      console.log(
        `[imageCompression] ${file.name}: ${(file.size / 1024).toFixed(0)}KB → ${(compressed.size / 1024).toFixed(0)}KB`
      )
      return compressed
    } catch (err) {
      console.warn('[imageCompression] compression failed, using original:', err)
      return file
    }
  }

  static async submitProperty(data: PropertySubmissionData): Promise<PropertySubmissionResponse> {
    let attemptedUrls: string[] = []
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      const requestInit: RequestInit = {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify(data),
      }

      let response: Response | null = null
      let lastNetworkError: unknown = null

      for (const baseUrl of this.BACKEND_BASE_URLS) {
        const requestUrl = `${baseUrl}${this.SUBMIT_PROPERTY_PATH}`
        attemptedUrls.push(requestUrl)
        try {
          response = await fetch(requestUrl, requestInit)
          break
        } catch (error) {
          lastNetworkError = error
        }
      }

      if (!response) {
        throw lastNetworkError instanceof Error
          ? lastNetworkError
          : new TypeError('Failed to fetch')
      }

      if (!response.ok) {
        let errorData: unknown = null
        try {
          errorData = await response.json()
        } catch {
          errorData = null
        }

        const parsedError =
          typeof errorData === 'object' &&
          errorData !== null &&
          'error' in errorData &&
          typeof (errorData as { error?: unknown }).error === 'string'
            ? (errorData as { error: string }).error
            : null

        const errorMessage = parsedError || `Failed to submit property (HTTP ${response.status})`
        throw new Error(errorMessage)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Property submission error:', error)

      const isNetworkError = error instanceof TypeError && error.message.includes('Failed to fetch')
      const networkErrorMessage =
        `Unable to reach property API. Checked: ${attemptedUrls.join(', ')}. ` +
        'Start backend server or set VITE_BACKEND_URL to your running backend URL.'

      return {
        success: false,
        error: isNetworkError ? networkErrorMessage : error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  static async uploadFile(file: File, bucket: string, path: string): Promise<string | null> {
    try {
      const fileToUpload = await PropertyService.compressImage(file)

      const uploadPath = file.type.startsWith('image/')
        ? path.replace(/\.[^.]+$/, '.jpg')
        : path

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(uploadPath, fileToUpload, {
          cacheControl: '3600',
          upsert: false,
          contentType: fileToUpload.type,
        })

      if (error) {
        if (error.message?.includes('Bucket not found')) {
          console.error(`File upload error: Bucket "${bucket}" not found. Create this bucket in Supabase Storage and set proper policies.`)
        }
        console.error('File upload error:', error)
        return null
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

      return urlData.publicUrl
    } catch (error) {
      console.error('File upload error:', error)
      return null
    }
  }

  static async uploadMultipleFiles(files: File[], bucket: string, basePath: string): Promise<string[]> {
    const uploadPromises = files.map(async (file, index) => {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${index}.${fileExt}`
      const filePath = `${basePath}/${fileName}`

      return await this.uploadFile(file, bucket, filePath)
    })

    const results = await Promise.all(uploadPromises)
    return results.filter((url): url is string => url !== null)
  }
}