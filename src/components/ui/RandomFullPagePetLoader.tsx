import { useRandomPageLoader } from "@/hooks/useRandomPageLoader";

interface RandomFullPagePetLoaderProps {
  dataLoaded?: boolean;
  onComplete?: () => void;
}

export const RandomFullPagePetLoader = ({ dataLoaded = false, onComplete }: RandomFullPagePetLoaderProps) => {
  const Loader = useRandomPageLoader();

  return <Loader dataLoaded={dataLoaded} onComplete={onComplete} />;
};

export default RandomFullPagePetLoader;
