// Extend the Enketo Core Form Model, and expose it for local testing.

import { FormModel as Model } from 'enketo-core';
import XPathJS from 'enketo-xpathjs';
import $ from 'jquery';

// Add OC custom XPath functions
import extendXPath from 'enketo-xpath-extensions-oc';
extendXPath( XPathJS );

Model.prototype.getUpdateEventData = function( el, type ) {
    let fullPath;
    let xmlFragment;
    let file;

    if ( !el ) {
        console.error( new Error( 'XML Node not found. Form probably contains reference to non-existing XML node.' ) );
        return {};
    }
    fullPath = this.getXPath( el, 'instance', true );
    xmlFragment = this.getXmlFragmentStr( el );
    file = ( type === 'binary' ) ? el.textContent : undefined;
    return {
        fullPath,
        xmlFragment,
        file
    };
};

Model.prototype.getRemovalEventData = function( el ) {
    const xmlFragment = this.getXmlFragmentStr( el );
    return {
        xmlFragment
    };
};

Model.prototype.getXmlFragmentStr = function( node ) {
    let clone;
    let n;
    let dataStr;
    const tempAttrName = 'temp-id';
    const id = Math.floor( Math.random() * 100000000 );
    node.setAttribute( tempAttrName, id );
    clone = this.rootElement.cloneNode( true );
    node.removeAttribute( tempAttrName );
    n = clone.querySelector( `[${tempAttrName}="${id}"]` );
    n.removeAttribute( tempAttrName );

    $( n ).children().remove();

    while ( n !== clone ) {
        $( n ).siblings().remove();
        n = n.parentNode;
    }

    // Remove comment nodes from tiny remaining fragment
    $( clone ).find( '*' ).addBack().contents().filter( function() {
        return this.nodeType === 8;
    } ).remove();

    dataStr = ( new XMLSerializer() ).serializeToString( clone, 'text/xml' );
    // restore default namespaces
    dataStr = dataStr.replace( /\s(data-)(xmlns=("|')[^\s>]+("|'))/g, ' $2' );
    return dataStr;
};

Model.prototype.isMarkedComplete = function() {
    // Monkeypatch the namespace resolver to ensure oc namespace prefix is declared
    // It's alright since this function is only called once.
    const OPENCLINICA_NS = 'http://openclinica.org/xforms';
    if ( !this.getNamespacePrefix( OPENCLINICA_NS ) ) {
        this.namespaces[ 'oc' ] = OPENCLINICA_NS;
    }

    return this.evaluate( '/node()/@oc:complete = "true"', 'boolean', null, null, true );
};

export default Model;
