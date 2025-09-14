package kitchensv.com

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.MotionEvent
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.AutoCompleteTextView
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.google.firebase.firestore.FirebaseFirestore
import kitchensv.com.data.models.Producto

class MainActivity : AppCompatActivity() {

    private lateinit var btnAOrden: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        btnAOrden = findViewById(R.id.btn_a_orden)

        btnAOrden.setOnClickListener {
            val intent = Intent(this, OrdenActivity::class.java)
            startActivity(intent)
        }
    }
}
