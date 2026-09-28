import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAppSelector } from '../hooks/useAppDispatch';
import {
  selectIsAuthenticated,
  selectUserRole,
  selectBootstrapped,
} from '../store/slices/auth.slice';
import { bootstrapSession } from '../store/bootstrap';
import { useSessionSync } from '../hooks/useSessionSync';
import { Colors } from '../constants/colors';
import AuthNavigator from './AuthNavigator';
import DrawerNavigator from './DrawerNavigator';
import AdminNavigator from './AdminNavigator';

const ADMIN_ROLES = ['super_admin', 'diocese_admin', 'church_admin', 'priest', 'pa'];

/** Runs only while signed in, so the profile/parish sync never fires anonymously. */
function SessionSync() {
  useSessionSync();
  return null;
}

export default function RootNavigator() {
  const bootstrapped = useAppSelector(selectBootstrapped);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const role = useAppSelector(selectUserRole);

  useEffect(() => {
    bootstrapSession();
  }, []);

  if (!bootstrapped) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={Colors.accent.gold} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated && <SessionSync />}
      {!isAuthenticated ? (
        <AuthNavigator />
      ) : ADMIN_ROLES.includes(role ?? '') ? (
        <AdminNavigator />
      ) : (
        <DrawerNavigator />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary.navyDark,
  },
});
