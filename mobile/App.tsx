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
} from 'react-native';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';

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
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [hasError, setHasError] = useState(false);

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

  const handleReload = () => {
    setHasError(false);
    setIsLoading(true);
    webViewRef.current?.reload();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#202124" />

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
          ref={webViewRef}
          source={{ uri: APP_URL }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsBackForwardNavigationGestures={true}
          pullToRefreshEnabled={true}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onNavigationStateChange={(navState: { canGoBack: boolean }) => setCanGoBack(navState.canGoBack)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      )}

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={styles.loadingText}>Loading ClearTasks...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202124',
  },
  webview: {
    flex: 1,
    backgroundColor: '#202124',
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
