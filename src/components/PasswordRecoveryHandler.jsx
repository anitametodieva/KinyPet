import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import * as Linking from "expo-linking";

import { supabase } from "../services/supabase";
import { COLORS } from "../constants/colors";
import ResetPasswordScreen from "../screens/auth/ResetPasswordScreen";

export default function PasswordRecoveryHandler({ children }) {
  const [isRecovering, setIsRecovering] = useState(false);
  const [isProcessing, setIsProcessing] = useState(true);
  const handledUrls = useRef(new Set());

  useEffect(() => {
    let active = true;

    async function handleRecoveryUrl(url) {
      if (!url || handledUrls.current.has(url)) return;

      const parsed = Linking.parse(url);

      if (parsed.path !== "reset-password") return;

      handledUrls.current.add(url);
      setIsProcessing(true);

      try {
        const query = url.split("?")[1]?.split("#")[0] || "";
        const fragment = url.split("#")[1] || "";

        const params = new URLSearchParams(
          [query, fragment].filter(Boolean).join("&"),
        );

        const errorMessage = params.get("error_description");

        if (errorMessage || params.get("error")) {
          throw new Error(
            errorMessage || "The password reset link is invalid or expired.",
          );
        }

        const code = params.get("code");
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) throw error;
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;
        } else {
          throw new Error("The password reset link is invalid or expired.");
        }

        if (active) {
          setIsRecovering(true);
        }
      } catch (error) {
        if (active) {
          Alert.alert(
            "Password Reset Failed",
            error.message || "Could not verify the password reset link.",
          );
          setIsRecovering(false);
        }
      } finally {
        if (active) {
          setIsProcessing(false);
        }
      }
    }

    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleRecoveryUrl(url);
    });

    Linking.getInitialURL()
      .then((url) => {
        if (url) {
          return handleRecoveryUrl(url);
        }
      })
      .finally(() => {
        if (active) {
          setIsProcessing(false);
        }
      });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  if (isProcessing) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: COLORS.background,
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (isRecovering) {
    return (
      <ResetPasswordScreen
        onPasswordReset={async () => {
          setIsRecovering(false);
          await supabase.auth.signOut();
        }}
      />
    );
  }

  return children;
}
