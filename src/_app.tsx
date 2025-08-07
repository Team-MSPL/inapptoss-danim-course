import React, { type PropsWithChildren } from 'react';
import { Bedrock, type InitialProps } from 'react-native-bedrock';
import { context } from '../require.context';

function AppContainer({ children }: PropsWithChildren<InitialProps>) {
  return <>{children}</>;
}

export default Bedrock.registerApp(AppContainer, {
  appName: '%%appName%%',
  context,
});
