package kitchensv.com

import android.os.Bundle
import android.text.InputType
import android.util.Log
import android.view.Gravity
import android.view.MotionEvent
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.AutoCompleteTextView
import android.widget.Button
import android.widget.EditText
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.google.firebase.firestore.FirebaseFirestore
import kitchensv.com.data.models.Producto

class OrdenActivity : AppCompatActivity() {

    private lateinit var numeroMesaEditText: EditText
    private lateinit var notaEditText: EditText
    private lateinit var platosContainer: LinearLayout
    private lateinit var agregarPlatoButton: Button
    private lateinit var enviarOrdenButton: Button

    private val platosInputs = mutableListOf<AutoCompleteTextView>()
    private val platosSugeridos = mutableListOf<String>()
    private lateinit var firestore: FirebaseFirestore

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_orden)

        firestore = FirebaseFirestore.getInstance()

        numeroMesaEditText = findViewById(R.id.et_numero_mesa)
        notaEditText = findViewById(R.id.et_nota)
        platosContainer = findViewById(R.id.container_platos)
        agregarPlatoButton = findViewById(R.id.btn_agregar_plato)
        enviarOrdenButton = findViewById(R.id.btn_enviar) // Nuevo botón en tu layout

        // Cargar los platos desde Firestore
        fetchPlatosFromFirestore()

        // Botón para agregar más platos
        agregarPlatoButton.setOnClickListener {
            agregarNuevoPlato()
        }

        // Botón para enviar la orden
        enviarOrdenButton.setOnClickListener {
            capturarDatosYEnviar()
        }
    }

    private fun fetchPlatosFromFirestore() {
        val restauranteId = "Q5NoBsAMO0UVMjOqpszV" // Cambia por tu ID real

        firestore.collection("restaurantes")
            .document(restauranteId)
            .collection("productos")
            .get()
            .addOnSuccessListener { result ->
                platosSugeridos.clear()

                for (document in result) {
                    val producto = document.toObject(Producto::class.java)
                    producto.nombre?.let { nombre ->
                        platosSugeridos.add(nombre)
                    }
                }

                // Agregar el primer AutoCompleteTextView solo si no hay ninguno
                if (platosInputs.isEmpty()) {
                    agregarNuevoPlato()
                }

            }
            .addOnFailureListener { e ->
                Toast.makeText(this, "Error al cargar platos: ${e.message}", Toast.LENGTH_SHORT).show()
            }
    }

    private fun agregarNuevoPlato() {
        val adapter = ArrayAdapter(
            this,
            android.R.layout.simple_dropdown_item_1line,
            platosSugeridos
        )

        // Layout horizontal para plato + cantidad + basurero
        val filaPlato = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                setMargins(0, 8, 0, 0)
            }
        }

        // AutoCompleteTextView para el nombre del plato
        val nuevoPlatoInput = AutoCompleteTextView(this).apply {
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 2f)
            hint = "Producto"
            threshold = 1
            setAdapter(adapter)
        }

        // EditText para la cantidad
        val cantidadInput = EditText(this).apply {
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
            inputType = InputType.TYPE_CLASS_NUMBER
            setText("1") // cantidad por defecto
            gravity = Gravity.CENTER
        }

        // Icono de basurero
        val eliminarIcon = ImageView(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
            setImageDrawable(ContextCompat.getDrawable(context, R.drawable.ic_basurero))
            setOnClickListener {
                platosContainer.removeView(filaPlato)
                platosInputs.remove(nuevoPlatoInput)
                // opcional: manejar también cantidadInput si lo necesitas
            }
        }

        // Agregar vistas a la fila horizontal
        filaPlato.addView(nuevoPlatoInput)
        filaPlato.addView(cantidadInput)
        filaPlato.addView(eliminarIcon)

        // Agregar fila al container
        platosContainer.addView(filaPlato)
        platosInputs.add(nuevoPlatoInput)
    }


    private fun capturarDatosYEnviar() {
        val numeroMesa = numeroMesaEditText.text.toString().trim()
        val nota = notaEditText.text.toString().trim()

        // Lista de platos con nombre y cantidad
        val ordenes = mutableListOf<Map<String, Any>>()

        for (platoInput in platosInputs) {
            val fila = platoInput.parent as LinearLayout
            val cantidadInput = fila.getChildAt(1) as EditText

            val nombre = platoInput.text.toString().trim()
            val cantidad = cantidadInput.text.toString().toIntOrNull() ?: 1

            if (nombre.isNotEmpty()) {
                ordenes.add(
                    mapOf(
                        "nombre" to nombre,
                        "cantidad" to cantidad
                    )
                )
            }
        }

        if (ordenes.isEmpty()) {
            Toast.makeText(this, "No se ingresaron platos.", Toast.LENGTH_SHORT).show()
            return
        }

        // Mostrar log / toast para verificar
        Log.d("OrdenActivity", "Mesa: $numeroMesa, Ordenes: $ordenes, Nota: $nota")

        val mensajeOrdenes = ordenes.joinToString(separator = "\n") { "${it["nombre"]} x${it["cantidad"]}" }
        val mensaje = "Orden para la mesa: $numeroMesa\n" +
                "Platos:\n$mensajeOrdenes\n" +
                "Nota: $nota"

        Toast.makeText(this, mensaje, Toast.LENGTH_LONG).show()

        // Aquí puedes enviar el map a Firestore, por ejemplo:
        val pedidoData = hashMapOf(
            "mesa" to numeroMesa,
            "notas" to nota,
            "platos" to ordenes,
            "timestamp_create" to System.currentTimeMillis(),
            "timestamp_update" to System.currentTimeMillis()
        )

        firestore.collection("pedidos")
            .add(pedidoData)
            .addOnSuccessListener {
                Toast.makeText(this, "Orden enviada correctamente.", Toast.LENGTH_SHORT).show()
                // opcional: limpiar inputs
            }
            .addOnFailureListener { e ->
                Toast.makeText(this, "Error al enviar orden: ${e.message}", Toast.LENGTH_SHORT).show()
            }
    }

}