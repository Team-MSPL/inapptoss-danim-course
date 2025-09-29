import { AppsInToss } from '@apps-in-toss/framework';
import { PropsWithChildren } from 'react';
import { InitialProps } from '@granite-js/react-native';
import { context } from '../require.context';
import { store } from './store';
import { Provider } from 'react-redux';
function AppContainer({ children }: PropsWithChildren<InitialProps>) {
  return <Provider store={store}>{children}</Provider>;
}

export default AppsInToss.registerApp(AppContainer, { context });
