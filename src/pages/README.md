# Current Structure
```
└── 📁pages
    └── 📁admin
    └── 📁superadmin
    └── 📁user <- All non-admin pages go here
        └── 📁ListProperty
            └── 📁components <- Page-exclusive ui components
            └── 📁sections <- Sections of the page separated by file
            └── 📁static <- Static elements
            └── 📁types <- Type declaration
            ├── index.tsx <- Page
```