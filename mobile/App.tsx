import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  BackHandler,
  Platform,
  NativeModules,
  useColorScheme,
  LogBox,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';

LogBox.ignoreLogs(['SafeAreaView has been deprecated']);

// In production, replace with your deployed Vercel URL
const PRODUCTION_URL = 'https://tasks-app-vercel.app';

function getDevUrl(): string {
  try {
    const hostUri =
      Constants.expoConfig?.hostUri ||
      (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
      (Constants as any).manifest?.debuggerHost;

    if (hostUri) {
      const host = hostUri.split(':')[0];
      if (host) {
        return `http://${host}:3000`;
      }
    }
  } catch {
    // fallback
  }

  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const address = scriptURL.split('://')[1]?.split('/')[0];
      const host = address?.split(':')[0];
      if (host) {
        return `http://${host}:3000`;
      }
    }
  } catch {
    // fallback
  }

  // Fallback to computer's local Wi-Fi IP
  return 'http://192.168.1.5:3000';
}

declare const __DEV__: boolean | undefined;
const isDev = typeof __DEV__ !== 'undefined' ? Boolean(__DEV__) : true;
const APP_URL = isDev ? getDevUrl() : PRODUCTION_URL;

export default function MobileApp() {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<'light' | 'dark'>(systemColorScheme === 'dark' ? 'dark' : 'light');
  const webViewRef = useRef<WebView>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [hasError, setHasError] = useState(false);

  const [currentUri, setCurrentUri] = useState<string>(APP_URL);
  const [webViewKey, setWebViewKey] = useState<number>(0);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const redirectTimeoutRef = useRef<any>(null);

  const isDark = theme === 'dark';
  const statusBarBg = isDark ? '#131314' : '#F0F4F9';
  const statusBarStyle = isDark ? 'light-content' : 'dark-content';
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0;

  // Handle hardware Android back button to navigate WebView history
  React.useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [canGoBack]);

  const fixUrl = (url: string): string => {
    if (url.includes('localhost:3000') || url.includes('127.0.0.1:3000')) {
      return url.replace(/https?:\/\/(localhost|127\.0\.0\.1):3000/, APP_URL);
    }
    return url;
  };

  const handleInterceptUrl = (url: string): boolean => {
    if (url.includes('localhost:3000') || url.includes('127.0.0.1:3000')) {
      const targetUrl = fixUrl(url);
      setIsRedirecting(true);
      setCurrentUri(targetUrl);
      setWebViewKey((prev) => prev + 1);

      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = setTimeout(() => {
        setIsRedirecting(false);
      }, 10000);

      return true;
    }
    return false;
  };

  const handleReload = () => {
    setHasError(false);
    setIsFirstLoad(true);
    setIsRedirecting(false);
    setCurrentUri(APP_URL);
    setWebViewKey((prev) => prev + 1);
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'THEME_CHANGE' && (data.theme === 'light' || data.theme === 'dark')) {
        setTheme(data.theme);
      }
    } catch {
      // ignore
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          paddingTop: statusBarHeight,
          backgroundColor: statusBarBg,
        },
      ]}
    >
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={statusBarBg}
        translucent={false}
      />

      {hasError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to connect to ClearTasks</Text>
          <Text style={styles.errorSubtitle}>
            Make sure your dev server is running on {APP_URL} or verify your internet connection.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleReload}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          key={webViewKey}
          ref={webViewRef}
          source={{ uri: currentUri }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsBackForwardNavigationGestures={true}
          pullToRefreshEnabled={true}
          originWhitelist={['*']}
          setSupportMultipleWindows={false}
          javaScriptCanOpenWindowsAutomatically={true}
          userAgent={
            Platform.OS === 'android'
              ? 'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
              : undefined
          }
          onMessage={handleMessage}
          onLoadEnd={() => {
            setIsFirstLoad(false);
            setIsRedirecting(false);
            if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
          }}
          onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack);
            if (navState.url) {
              handleInterceptUrl(navState.url);
            }
          }}
          onShouldStartLoadWithRequest={(request) => {
            if (handleInterceptUrl(request.url)) {
              return false;
            }
            return true;
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            const failingUrl = nativeEvent.url || '';
            if (failingUrl.includes('localhost:3000') || failingUrl.includes('127.0.0.1:3000')) {
              handleInterceptUrl(failingUrl);
              return;
            }
            if (isFirstLoad) {
              setHasError(true);
            }
          }}
          renderError={() => (
            <View style={styles.redirectingOverlay}>
              <ActivityIndicator size="large" color="#4285F4" />
              <Text style={styles.redirectingText}>Completing sign-in...</Text>
            </View>
          )}
        />
      )}

      {(isFirstLoad || isRedirecting) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={styles.loadingText}>
            {isRedirecting ? 'Completing sign-in...' : 'Loading ClearTasks...'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#202124',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#E8EAED',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  redirectingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#202124',
    alignItems: 'center',
    justifyContent: 'center',
  },
  redirectingText: {
    color: '#E8EAED',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#202124',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E8EAED',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#9AA0A6',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
