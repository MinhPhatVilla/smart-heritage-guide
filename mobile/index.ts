import React from 'react';
import { Platform, Text, TextInput } from 'react-native';
import { registerRootComponent } from 'expo';

import { APP_FONT } from './src/theme';
import App from './App';

// Enforce a single unified font (Times New Roman) across the entire app
// to guarantee flawless Vietnamese diacritics on Web, iOS, and Android.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleId = 'shg-times-new-roman-font';
  if (!document.getElementById(styleId)) {
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = `
      html, body, #root, *, *::before, *::after {
        font-family: "Times New Roman", Times, serif !important;
      }
    `;
    document.head.appendChild(styleEl);
  }
} else if (APP_FONT) {
  const applyDefaultNativeFont = (Component: unknown) => {
    try {
      const comp = Component as { render?: (...args: unknown[]) => React.ReactElement };
      if (typeof comp?.render !== 'function') return;
      const origRender = comp.render;
      comp.render = function patchedRender(...args: unknown[]) {
        const origin = origRender.apply(this, args);
        if (!origin || typeof origin !== 'object') return origin;
        const props = (origin.props ?? {}) as { style?: unknown };
        return React.cloneElement(origin, {
          style: [{ fontFamily: APP_FONT }, props.style],
        } as Record<string, unknown>);
      };
    } catch {
      // Safe fallback if native renderer is frozen
    }
  };
  applyDefaultNativeFont(Text);
  applyDefaultNativeFont(TextInput);
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately.
registerRootComponent(App);
