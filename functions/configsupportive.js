// eslint-disable-next-line import/extensions
import { config } from '../configs/config.js';

function getCredentialsForUsername(username) {
    const configCredentials = config.credentials;
    const singleelement = configCredentials.filter((a) => a.username === username)[0];
    return singleelement;
    // const { password } = singleelement;
    // return password;
}

// eslint-disable-next-line import/prefer-default-export
export { getCredentialsForUsername };
