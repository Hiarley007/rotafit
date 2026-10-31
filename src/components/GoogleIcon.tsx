import Svg, { Path } from 'react-native-svg';

export function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#EA4335"
        d="M 24 9.5 c 3.5 0 6.6 1.2 9.1 3.6 l 6.8 -6.8 C 35.9 2.4 30.4 0 24 0 C 14.6 0 6.5 5.4 2.5 13.2 l 7.9 6.1 C 12.3 13.1 17.7 9.5 24 9.5 z"
      />
      <Path
        fill="#4285F4"
        d="M 46.5 24.5 c 0 -1.6 -0.1 -3.1 -0.4 -4.5 H 24 v 9 h 12.7 c -0.5 3 -2.2 5.5 -4.7 7.2 l 7.4 5.7 c 4.3 -4 6.8 -9.9 6.8 -17.4 z"
      />
      <Path
        fill="#FBBC05"
        d="M 10.4 19.3 a 14.5 14.5 0 0 0 0 9.4 l -7.9 6.1 a 24 24 0 0 1 0 -21.6 l 7.9 6.1 z"
      />
      <Path
        fill="#34A853"
        d="M 24 48 c 6.4 0 11.9 -2.1 15.8 -5.8 l -7.4 -5.7 c -2.1 1.4 -4.9 2.3 -8.4 2.3 c -6.3 0 -11.7 -3.6 -13.6 -8.7 l -7.9 6.1 C 6.5 42.6 14.6 48 24 48 z"
      />
    </Svg>
  );
}
