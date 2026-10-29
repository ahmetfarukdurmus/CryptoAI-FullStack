import { StyleSheet } from 'react-native-web';

export function resolve(styleProp, cleanedProps) {
  if (styleProp) {
    return StyleSheet.flatten([styleProp, cleanedProps]);
  }
  return cleanedProps;
}
