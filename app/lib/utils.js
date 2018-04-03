const crypto = require( 'crypto' );
const config = require( '../models/config-model' ).server;
// var debug = require( 'debug' )( 'utils' );

/** 
 * Returns a unique, predictable openRosaKey from a survey oject
 * @param  {[type]} survey [description]
 * @return {[type]}        [description]
 */
function getOpenRosaKey( survey, prefix ) {
    if ( !survey || !survey.openRosaServer || !survey.openRosaId ) {
        return null;
    }
    prefix = prefix || 'or:';
    // Server URL is not case sensitive, form ID is case-sensitive
    return `${prefix + cleanUrl( survey.openRosaServer )},${survey.openRosaId.trim()}`;
}

function getXformsManifestHash( manifest, type ) {
    const hash = '';

    if ( !manifest || manifest.length === 0 ) {
        return hash;
    }
    if ( type === 'all' ) {
        return md5( JSON.stringify( manifest ) );
    }
    if ( type ) {
        const filtered = manifest.map( mediaFile => mediaFile[ type ] );
        return md5( JSON.stringify( filtered ) );
    }
    return hash;
}

/**
 * Cleans a Server URL so it becomes useful as a db key
 * It strips the protocol, removes a trailing slash, removes www, and converts to lowercase
 * @param  {string} url [description]
 * @return {string=}     [description]
 */
function cleanUrl( url ) {
    url = url.trim();
    if ( url.lastIndexOf( '/' ) === url.length - 1 ) {
        url = url.substring( 0, url.length - 1 );
    }
    const matches = url.match( /https?:\/\/(www\.)?(.+)/ );
    if ( matches && matches.length > 2 ) {
        return matches[ 2 ].toLowerCase();
    }
    return cleanUrl;
}

/**
 * The name of this function is deceiving. It checks for a valid server URL and therefore doesn't approve of:
 * - fragment identifiers
 * - query strings
 * 
 * @param  {[type]}  url [description]
 * @return {Boolean}     [description]
 */
function isValidUrl( url ) {
    const validUrl = /^(https?:\/\/)(([\da-z.-]+)\.([a-z.]{2,6})|(([0-9]{1,3}\.){3}[0-9]{1,3})|localhost)(:(102[4-9]|10[3-9][0-9]|1[1-9][0-9]{2}|[2-9][0-9]{3}|[1-4][0-8]{4}|490[0-9]{2}|491[0-4][0-9]|4915[0-1]))?([/\w .\-()]*)*\/?[/\w .-]*$/;
    return validUrl.test( url );
}

function md5( message ) {
    const hash = crypto.createHash( 'md5' );
    hash.update( message );
    return hash.digest( 'hex' );
}

/**
 * This is not secure encryption as it doesn't use a random cipher. Therefore the result is 
 * always the same for each text & pw (which is desirable in this case). 
 * This means the password is vulnerable to be cracked,
 * and we should use a dedicated low-importance password for this.
 * 
 * @param  {string} text The text to be encrypted
 * @param  {string} pw   The password to use for encryption
 * @return {string}      The encrypted result.
 */
function insecureAes192Encrypt( text, pw ) {
    let encrypted;
    const cipher = crypto.createCipher( 'aes192', pw );
    encrypted = cipher.update( text, 'utf8', 'hex' );
    encrypted += cipher.final( 'hex' );

    return encrypted;
}

function insecureAes192Decrypt( encrypted, pw ) {
    let decrypted;
    const decipher = crypto.createDecipher( 'aes192', pw );
    decrypted = decipher.update( encrypted, 'hex', 'utf8' );
    decrypted += decipher.final( 'utf8' );

    return decrypted;
}

function randomString( howMany, chars ) {
    chars = chars || 'abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789';
    const rnd = crypto.randomBytes( howMany ),
        value = new Array( howMany ),
        len = chars.length;

    for ( let i = 0; i < howMany; i++ ) {
        value[ i ] = chars[ rnd[ i ] % len ];
    }

    return value.join( '' );
}

function pickRandomItemFromArray( array ) {
    if ( !Array.isArray( array ) || array.length === 0 ) {
        return null;
    }
    const random = Math.floor( Math.random() * array.length );
    if ( !array[ random ] ) {
        return null;
    }
    return array[ random ];
}

// not recursive, only goes one property level deep
function areOwnPropertiesEqual( a, b ) {
    let prop;
    const results = [];

    if ( typeof a !== 'object' || typeof b !== 'object' ) {
        return null;
    }

    for ( prop in a ) {
        if ( a.hasOwnProperty( prop ) ) {
            if ( a[ prop ] !== b[ prop ] ) {
                return false;
            }
            results[ prop ] = true;
        }
    }
    for ( prop in b ) {
        if ( !results[ prop ] && b.hasOwnProperty( prop ) ) {
            if ( b[ prop ] !== a[ prop ] ) {
                return false;
            }
        }
    }
    return true;
}

/**
 * Converts a url to a local (proxied) url.
 *
 * @param  {string} url The url to convert.
 * @return {string}     The converted url.
 */
function toLocalMediaUrl( url ) {
    const localUrl = `${config[ 'base path' ]}/media/get/${url.replace( /(https?):\/\//, '$1/' )}`;
    return localUrl;
}


module.exports = {
    getOpenRosaKey,
    getXformsManifestHash,
    cleanUrl,
    isValidUrl,
    md5,
    randomString,
    pickRandomItemFromArray,
    areOwnPropertiesEqual,
    insecureAes192Decrypt,
    insecureAes192Encrypt,
    toLocalMediaUrl
};
