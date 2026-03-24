import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from "amazon-cognito-identity-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_POOL_ID = "us-east-1_PLACEHOLDER";
const CLIENT_ID = "PLACEHOLDER";

const poolData = {
  UserPoolId: USER_POOL_ID,
  ClientId: CLIENT_ID,
};

const userPool = new CognitoUserPool(poolData);

export async function signIn(
  email: string,
  password: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    user.authenticateUser(authDetails, {
      onSuccess: async (session) => {
        const token = session.getIdToken().getJwtToken();
        await AsyncStorage.setItem("cyh_token", token);
        resolve(token);
      },
      onFailure: (err) => reject(err),
      newPasswordRequired: () => {
        reject(new Error("NEW_PASSWORD_REQUIRED"));
      },
    });
  });
}

export async function completeNewPassword(
  email: string,
  oldPassword: string,
  newPassword: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: oldPassword,
    });

    user.authenticateUser(authDetails, {
      onSuccess: async (session) => {
        const token = session.getIdToken().getJwtToken();
        await AsyncStorage.setItem("cyh_token", token);
        resolve(token);
      },
      onFailure: (err) => reject(err),
      newPasswordRequired: (_userAttributes) => {
        user.completeNewPasswordChallenge(newPassword, {}, {
          onSuccess: async (session) => {
            const token = session.getIdToken().getJwtToken();
            await AsyncStorage.setItem("cyh_token", token);
            resolve(token);
          },
          onFailure: (err) => reject(err),
        });
      },
    });
  });
}

export async function forgotPassword(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.forgotPassword({
      onSuccess: () => resolve(),
      onFailure: (err) => reject(err),
    });
  });
}

export async function confirmForgotPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.confirmPassword(code, newPassword, {
      onSuccess: () => resolve(),
      onFailure: (err) => reject(err),
    });
  });
}

export async function signUp(
  email: string,
  password: string,
  name: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const attrs = [
      new CognitoUserAttribute({ Name: "email", Value: email }),
      new CognitoUserAttribute({ Name: "name", Value: name }),
    ];

    userPool.signUp(email, password, attrs, [], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export async function confirmSignUp(
  email: string,
  code: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.confirmRegistration(code, true, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export async function signOut(): Promise<void> {
  const user = userPool.getCurrentUser();
  if (user) user.signOut();
  await AsyncStorage.removeItem("cyh_token");
}

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem("cyh_token");
}
