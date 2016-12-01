import { NgModule } from "@angular/core";
import { NativeScriptModule } from "nativescript-angular/platform";

// to register `polyfill-crypto` component
import "nativescript-angular-webview-crypto";

import { AppComponent } from "./app.component";

@NgModule({
    declarations: [AppComponent],
    bootstrap: [AppComponent],
    imports: [NativeScriptModule]
})
export class AppModule { }
