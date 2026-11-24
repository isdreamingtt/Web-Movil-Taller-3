package com.icpctracker.app;

import android.Manifest;
import android.content.pm.PackageManager;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.journeyapps.barcodescanner.ScanContract;
import com.journeyapps.barcodescanner.ScanIntentResult;
import com.journeyapps.barcodescanner.ScanOptions;

@CapacitorPlugin(name = "EscanerQr", permissions = {
    @Permission(alias = "camara", strings = {Manifest.permission.CAMERA})
})
public class EscanerQrPlugin extends Plugin {
    @PluginMethod
    public void escanear(PluginCall llamada) {
        if (!getContext().getPackageManager().hasSystemFeature(PackageManager.FEATURE_CAMERA_ANY)) {
            llamada.reject("Este dispositivo no dispone de cámara.", "NO_CAMERA");
            return;
        }
        if (getPermissionState("camara") != PermissionState.GRANTED) {
            requestPermissionForAlias("camara", llamada, "alResolverPermisoCamara");
            return;
        }
        iniciarEscaner(llamada);
    }

    @PermissionCallback
    private void alResolverPermisoCamara(PluginCall llamada) {
        if (getPermissionState("camara") != PermissionState.GRANTED) {
            llamada.reject("Permiso de cámara rechazado. Habilítalo en Ajustes o ingresa el código manualmente.", "CAMERA_DENIED");
            return;
        }
        iniciarEscaner(llamada);
    }

    private void iniciarEscaner(PluginCall llamada) {
        try {
            ScanOptions opciones = new ScanOptions();
            opciones.setDesiredBarcodeFormats(ScanOptions.QR_CODE);
            opciones.setPrompt("Apunta al QR de la lista de entrenamiento");
            opciones.setBeepEnabled(false);
            opciones.setOrientationLocked(false);
            startActivityForResult(llamada, new ScanContract().createIntent(getContext(), opciones), "alObtenerResultado");
        } catch (Exception e) {
            llamada.reject("No se pudo iniciar el escáner de cámara.", "SCAN_FAILED", e);
        }
    }

    @ActivityCallback
    private void alObtenerResultado(PluginCall llamada, ActivityResult resultado) {
        if (llamada == null) return;
        ScanIntentResult lectura = new ScanContract().parseResult(resultado.getResultCode(), resultado.getData());
        JSObject respuesta = new JSObject();
        respuesta.put("cancelado", lectura.getContents() == null);
        if (lectura.getContents() != null) respuesta.put("valor", lectura.getContents());
        llamada.resolve(respuesta);
    }
}