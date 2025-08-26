declare global {
  interface Window {
    google: typeof google;
  }
  
  namespace google {
    namespace maps {
      namespace places {
        class Autocomplete {
          constructor(input: HTMLInputElement, opts?: AutocompleteOptions);
          addListener(eventName: string, handler: () => void): void;
          getPlace(): PlaceResult;
        }
        
        interface AutocompleteOptions {
          types?: string[];
          componentRestrictions?: ComponentRestrictions;
        }
        
        interface ComponentRestrictions {
          country?: string | string[];
        }
        
        interface PlaceResult {
          formatted_address?: string;
          geometry?: {
            location?: google.maps.LatLng;
          };
        }
      }
      
      namespace event {
        function clearInstanceListeners(instance: any): void;
      }
    }
  }
}

export {};
