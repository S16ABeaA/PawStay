import { useMemo, type ComponentType } from "react";
import PetLoaderCat from "@/components/ui/PetLoaderCat";
import PetLoaderDog from "@/components/ui/PetLoaderDog";
import PetLoaderHamster from "@/components/ui/PetLoaderHamster";

type FullPageLoaderProps = {
  onComplete?: () => void;
  dataLoaded?: boolean;
};

type FullPageLoaderComponent = ComponentType<FullPageLoaderProps>;

const fullPageLoaders: FullPageLoaderComponent[] = [
  PetLoaderCat,
  PetLoaderDog,
  PetLoaderHamster,
];

export const useRandomPageLoader = (): FullPageLoaderComponent => {
  return useMemo(() => {
    const randomIndex = Math.floor(Math.random() * fullPageLoaders.length);
    return fullPageLoaders[randomIndex];
  }, []);
};
