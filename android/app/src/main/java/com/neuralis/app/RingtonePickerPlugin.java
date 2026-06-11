package com.neuralis.app;

import android.app.Activity;
import android.content.Intent;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "RingtonePicker")
public class RingtonePickerPlugin extends Plugin {

    @PluginMethod
    public void pickRingtone(PluginCall call) {
        Intent intent = new Intent(RingtoneManager.ACTION_RINGTONE_PICKER);
        intent.putExtra(RingtoneManager.EXTRA_RINGTONE_TYPE, RingtoneManager.TYPE_NOTIFICATION);
        intent.putExtra(RingtoneManager.EXTRA_RINGTONE_TITLE, "Select Notification Sound");
        intent.putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_SILENT, true);
        intent.putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_DEFAULT, true);

        String existingUri = call.getString("existingUri");
        if (existingUri != null && !existingUri.isEmpty()) {
            intent.putExtra(RingtoneManager.EXTRA_RINGTONE_EXISTING_URI, Uri.parse(existingUri));
        }

        startActivityForResult(call, intent, "ringtoneResult");
    }

    @ActivityCallback
    private void ringtoneResult(PluginCall call, ActivityResult result) {
        if (result.getResultCode() == Activity.RESULT_OK) {
            Intent data = result.getData();
            if (data != null) {
                Uri ringtoneUri = data.getParcelableExtra(RingtoneManager.EXTRA_RINGTONE_PICKED_URI);
                JSObject response = new JSObject();
                if (ringtoneUri != null) {
                    response.put("uri", ringtoneUri.toString());
                    try {
                        Ringtone ringtone = RingtoneManager.getRingtone(getContext(), ringtoneUri);
                        if (ringtone != null) {
                            response.put("name", ringtone.getTitle(getContext()));
                        } else {
                            response.put("name", "System Sound");
                        }
                    } catch (Exception e) {
                        response.put("name", "System Sound");
                    }
                } else {
                    response.put("uri", "");
                    response.put("name", "Silent");
                }
                call.resolve(response);
                return;
            }
        }
        call.reject("User cancelled or selection failed");
    }
}
