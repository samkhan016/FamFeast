import {NativeModules, TurboModuleRegistry} from 'react-native';

type PickerResult = {
  didCancel?: boolean;
  errorCode?: string;
  errorMessage?: string;
  assets?: Array<{uri?: string}>;
};

type ImagePickerModule = {
  launchImageLibrary: (options: object, callback: (result: PickerResult) => void) => void;
};

function imagePicker(): ImagePickerModule {
  const turbo = TurboModuleRegistry.get('ImagePicker') as ImagePickerModule | null;
  const legacy = NativeModules.ImagePicker as ImagePickerModule | null | undefined;
  const picker = turbo ?? legacy;
  if (!picker?.launchImageLibrary) {
    throw new Error('Photo library is not available in this build. Rebuild the app and try again.');
  }
  return picker;
}

export function pickProfilePhoto(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    let picker: ImagePickerModule;
    try {
      picker = imagePicker();
    } catch (error) {
      reject(error);
      return;
    }
    picker.launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.7,
        includeBase64: false,
      },
      (result: PickerResult | PickerResult[]) => {
        const value = Array.isArray(result) ? result[0] : result;
        if (!value || value.didCancel) {
          resolve(null);
          return;
        }
        if (value.errorCode) {
          reject(new Error(value.errorMessage || 'Could not open your photos.'));
          return;
        }
        resolve(value.assets?.[0]?.uri ?? null);
      },
    );
  });
}
