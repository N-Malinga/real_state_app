import { Avatars, Client, OAuthProvider, Account, Databases, Query } from "react-native-appwrite";
import * as Linking from "expo-linking";
import { openAuthSessionAsync } from "expo-web-browser";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";

export const config = {
  platform: "com.malinga.livva",
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
  galleriesCollectionId: process.env.EXPO_PUBLIC_APPWRITE_GALLERIES_COLLECTION_ID,
  reviewsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_REVIEWS_COLLECTION_ID,
  agentsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_AGENT_COLLECTION_ID,
  propertiesCollectionId: process.env.EXPO_PUBLIC_APPWRITE_PROPERTIES_COLLECTION_ID,
};

export const client = new Client();

client
  .setEndpoint(config.endpoint!)
  .setProject(config.projectId!)
  .setPlatform(config.platform!);

export const avatar = new Avatars(client);
export const account = new Account(client);
export const databases = new Databases(client);

export async function login() {
  try {
    const redirectUri = Linking.createURL("/");

    const response = await account.createOAuth2Token(
      OAuthProvider.Google,
      redirectUri
    );
    if (!response) throw new Error("Failed to login");

    const browserResult = await openAuthSessionAsync(
      response.toString(),
      redirectUri
    );

    if (browserResult.type !== "success") throw new Error("Failed to login1");

    const url = new URL(browserResult.url);

    const secret = url.searchParams.get("secret")?.toString();
    const userId = url.searchParams.get("userId")?.toString();

    console.log("secretId and used:" + secret, userId);

    if (!secret || !userId) throw new Error("Failed to login2");

    const session = await account.createSession(userId, secret);

    if (!session) throw new Error("Failed to create a session");
    
    return true;

  } catch (error) {
    console.log(error);
    return false;
  }
}

export async function logout() {
  try {
    await account.deleteSession("current");
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

export async function getCurrentUser() {
  try {
    const response = await account.get();
    if (response.$id) {
      const userAvatar = avatar.getInitials(response.name);
      return {
        ...response,
        avatar: userAvatar.toString(),
      };
    }
    return response;
  } catch (error) {
    console.log(error);
    return false;
  }
}

export async function getLatestProperties(){
  try{
    const result = await databases.listDocuments(
      config.databaseId!, //!- indicate that the value is not null or undefined
      config.propertiesCollectionId!,
      [Query.orderAsc('$createdAt'), Query.limit(5)] //The third argument is an array of query options:
      //This query option orders the results in ascending order based on the createdAt field.
    )
    return result.documents;
  }catch(error){
    console.log(error);
    return [];
  }
}

export async  function getProperties({filter, query, limit}:{
  filter: string;
  query: string;
  limit?: number;
}){
  try{
    const buildQuery = [Query.orderDesc('$createdAt')];
    
    if(filter && filter !== 'All'){
      buildQuery.push(Query.equal('type', filter));
    }

    if(query){
      buildQuery.push(
        Query.or([
          Query.search('name', query),
          Query.search('address', query),
          Query.search('type', query),
        ])
      )
    }

    if(limit){
      buildQuery.push(Query.limit(limit));
    };

    const result = await databases.listDocuments(
      config.databaseId!,
      config.propertiesCollectionId!,
      buildQuery,
    )
    return result.documents;

  }catch(error){
    console.log(error);
    return [];
  }
}
