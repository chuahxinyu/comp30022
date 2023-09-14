import { UserI } from "~/types/UserI";
import { getUserConnections } from "../Repositories/ConnectionRepository";
import { getUserDetails } from "./UserDetails";
import { getCustomConnection } from "../Repositories/CustomContactRepository";




export async function getAllUserConnectionsDetails(userId: string) {
    const connectionDetails = [];
    
    // existing users in the CRM
    const userConnections = await getUserConnections(userId);
    for (var connectionId in userConnections) {
        connectionDetails.push(await getUserDetails(connectionId));
    }

    // custom contacts
    const customContacts = await getCustomConnection(userId);

    return [connectionDetails, customContacts];
  }