import { useGoogleSessionStore } from './googleSessionStore';

type TokenResponse = google.accounts.oauth2.TokenResponse;
type UserInfo = gapi.client.oauth2.Userinfo;

type RequireToken = (email?: string) => Promise<TokenResponse>;
type GetUserInfo = (accessToken: string) => Promise<UserInfo>;

export const setupGoogleSessionService = ({
  requireToken,
  getUserInfo,
}: {
  requireToken: RequireToken;
  getUserInfo: GetUserInfo;
}) => {
  const { getStore: get, update, getSessionList } = useGoogleSessionStore();

  const getToken = async (oldEmail?: string) => {
    const { access_token: accessToken, expires_in } =
      await requireToken(oldEmail);

    const expiresAt = Date.now() + parseInt(expires_in) * 1e3;

    const { email } = await getUserInfo(accessToken);

    if (!email) {
      throw new Error("don't have email");
    }

    const oldStore = await get();

    const store = {
      ...oldStore,
      [email]: {
        accessToken,
        expiresAt,
      },
    };

    await update(store);

    const token = store[oldEmail ?? email]?.accessToken;

    return token;
  };

  return {
    getToken,
    getSessionList,
  };
};
