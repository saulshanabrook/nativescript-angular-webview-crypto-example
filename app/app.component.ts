import { Component, ChangeDetectorRef } from "@angular/core";

function arrayBufferToHexString(arrayBuffer) {
  const byteArray = new Uint8Array(arrayBuffer);
  let hexString = "";
  let nextHexByte;

  for (let i=0; i<byteArray.byteLength; i++) {
      nextHexByte = byteArray[i].toString(16);
      if (nextHexByte.length < 2) {
          nextHexByte = "0" + nextHexByte;
      }
      hexString += nextHexByte;
  }
  return hexString;
}

function stringToArrayBuffer(str) {
  // http://stackoverflow.com/a/11058858/907060
  const buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
  const bufView = new Uint16Array(buf);
  for (let i=0, strLen=str.length; i<strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}


@Component({
    selector: "my-app",
    templateUrl: "app.component.html",
})
export class AppComponent {
    message = "";

    constructor(private cdr: ChangeDetectorRef) {}

    private addStatus(status: string) {
      this.message += `${status}\n`;
      this.cdr.detectChanges();
    }


  onTapDerive() {
    this.message = "";
    // from https://blog.engelke.com/2015/02/14/deriving-keys-from-passwords-with-webcrypto/
    const saltString = "Pick anything you want. This isn't secret.";
    const iterations = 1000;
    const hash = "SHA-256";
    const password = "My Secret!"

    this.addStatus("Running: importKey");
    crypto.subtle.importKey(
      "raw",
      stringToArrayBuffer(password),
      {"name": "PBKDF2"},
      false,
      ["deriveKey"]
    ).then(baseKey => {
      this.addStatus("Running: deriveKey");
      return window.crypto.subtle.deriveKey(
        {
          "name": "PBKDF2",
          "salt": stringToArrayBuffer(saltString),
          "iterations": iterations,
          "hash": hash
        },
        baseKey,
        {"name": "AES-CBC", "length": 128}, // Key we want
        true,                               // Extrable
        ["encrypt", "decrypt"]              // For new key
      );
    }).
    then(aesKey =>  {
      this.addStatus("Running: exportKey");
      return window.crypto.subtle.exportKey("raw", aesKey);
    }).
    then(keyBytes => {
      var hexKey = arrayBufferToHexString(keyBytes);
      this.addStatus(`Got key: ${hexKey}`)
    })
  }

  onTap() {
    this.message = "";
    this.addStatus("Running: getRandomValues");
    const iv = crypto.getRandomValues(new Uint8Array(16));
    this.addStatus("Running: waiting for getRandomValues");
    let aesKey;
    (iv as any)._promise.then(() => {
      this.addStatus(`Updated array: ${iv}`);
      this.addStatus("Running: generateKey");
      return crypto.subtle.generateKey(
        ({name: "AES-CBC", length: 128} as any), // Algorithm the key will be used with
        true,                           // Can extract key value to binary string
        ["encrypt", "decrypt"]          // Use for these operations
      );
    }).then(aesKey_ => {
      aesKey = aesKey_;
      this.addStatus(`Running: Got aesKey ${aesKey._jwk}`);

      this.addStatus("Running: Creating array");
      const plainTextString = "This is very sensitive stuff.";

      const plainTextBytes = new Uint8Array(plainTextString.length);
      for (let i = 0; i < plainTextString.length; i++) {
          plainTextBytes[i] = plainTextString.charCodeAt(i);
      }
      this.addStatus("Running: encrypt");
      return crypto.subtle.encrypt(
        ({name: "AES-CBC", iv: iv} as any), // Random data for security
        aesKey,                    // The key to use
        plainTextBytes             // Data to encrypt
      );
    }).then(cipherTextBytes => {
      this.addStatus("Running: decrypt");
      return crypto.subtle.decrypt(
        ({name: "AES-CBC", iv: iv} as any), // Same IV as for encryption
        aesKey,                    // The key to use
        cipherTextBytes            // Data to decrypt
      );
    }).then(decryptedBuffer => {
      const decryptedBytes = new Uint8Array(
        decryptedBuffer
      );

      this.addStatus("Running: creating string");
      let decryptedString = "";
      for (let i = 0; i < decryptedBytes.byteLength; i++) {
          decryptedString += String.fromCharCode(decryptedBytes[i]);
      }
      this.addStatus(`Decrypted: ${decryptedString}`);
    }).catch(e => {
      console.error(e);
    });
  }
}
