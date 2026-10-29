import * as RNWeb from 'react-native-web';

// Re-export everything from react-native-web
export * from 'react-native-web';

// Wrap unstable_createElement to flatten style arrays for DOM / SVG elements
const origCreateElement = RNWeb.unstable_createElement;
export const unstable_createElement = function (component, props, ...children) {
  if (props && props.style && Array.isArray(props.style)) {
    props = {
      ...props,
      style: RNWeb.StyleSheet.flatten(props.style),
    };
  }
  return origCreateElement.call(this, component, props, ...children);
};

// Mock React Native Fabric / TurboModule exports needed for web
export const codegenNativeComponent = () => RNWeb.View;
export const codegenNativeCommands = () => ({});
export const TurboModuleRegistry = {
  get: () => null,
  getEnforcing: () => ({}),
};

export default {
  ...RNWeb,
  unstable_createElement,
  codegenNativeComponent,
  codegenNativeCommands,
  TurboModuleRegistry,
};
