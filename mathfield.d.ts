import * as React from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      ['math-field']: React.DetailedHTMLProps<React.HTMLAttributes<MathfieldElement>, MathfieldElement>;
    }
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      ['math-field']: React.DetailedHTMLProps<React.HTMLAttributes<MathfieldElement>, MathfieldElement>;
    }
  }
}
