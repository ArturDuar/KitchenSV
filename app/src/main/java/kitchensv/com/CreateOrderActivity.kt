package kitchensv.com

import android.os.Bundle
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import kitchensv.com.models.Order
import kitchensv.com.models.Plato
import kitchensv.com.models.Producto
import com.google.firebase.firestore.FirebaseFirestore
import kitchensv.com.adapters.PlatosAdapter

class CreateOrderActivity : AppCompatActivity() {

    private lateinit var etMesa: EditText
    private lateinit var autoCompleteProducto: AutoCompleteTextView
    private lateinit var etCantidad: EditText
    private lateinit var etNotas: EditText
    private lateinit var btnAddPlato: Button
    private lateinit var btnSaveOrder: Button
    private lateinit var recyclerViewPlatos: RecyclerView

    private val db = FirebaseFirestore.getInstance()
    private val productos = mutableListOf<Producto>()
    private val platosSeleccionados = mutableListOf<Plato>()
    private lateinit var platosAdapter: PlatosAdapter
    private lateinit var productosAdapter: ArrayAdapter<Producto>

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_create_order)

        initViews()
        setupRecyclerView()
        loadProductos()
        setupListeners()
    }

    private fun initViews() {
        etMesa = findViewById(R.id.etMesa)
        autoCompleteProducto = findViewById(R.id.autoCompleteProducto)
        etCantidad = findViewById(R.id.etCantidad)
        etNotas = findViewById(R.id.etNotas)
        btnAddPlato = findViewById(R.id.btnAddPlato)
        btnSaveOrder = findViewById(R.id.btnSaveOrder)
        recyclerViewPlatos = findViewById(R.id.recyclerViewPlatos)
    }

    private fun setupRecyclerView() {
        platosAdapter = PlatosAdapter(platosSeleccionados) { plato ->
            platosSeleccionados.remove(plato)
            platosAdapter.notifyDataSetChanged()
        }
        recyclerViewPlatos.layoutManager = LinearLayoutManager(this)
        recyclerViewPlatos.adapter = platosAdapter
    }

    private fun loadProductos() {
        db.collection("productos")
            .whereEqualTo("disponible", true)
            .get()
            .addOnSuccessListener { documents ->
                productos.clear()
                val nombresProductos = mutableListOf<String>()

                documents.forEach { document ->
                    val producto = document.toObject(Producto::class.java)
                    producto.id = document.id
                    productos.add(producto)
                    nombresProductos.add(producto.nombre) // <-- solo guardo el nombre
                }
                setupAutoComplete()
            }
            .addOnFailureListener {
                Toast.makeText(this, "Error al cargar productos", Toast.LENGTH_SHORT).show()
            }
    }

    private fun setupAutoComplete() {
        productosAdapter =
            ArrayAdapter(this, android.R.layout.simple_dropdown_item_1line, productos)
        autoCompleteProducto.setAdapter(productosAdapter)
    }

    private fun setupListeners() {
        btnAddPlato.setOnClickListener {
            addPlatoToOrder()
        }

        btnSaveOrder.setOnClickListener {
            saveOrder()
        }
    }

    private fun addPlatoToOrder() {
        val productoText = autoCompleteProducto.text.toString()
        val cantidadText = etCantidad.text.toString()

        if (productoText.isEmpty()) {
            Toast.makeText(this, "Seleccione un producto", Toast.LENGTH_SHORT).show()
            return
        }

        if (cantidadText.isEmpty()) {
            Toast.makeText(this, "Ingrese la cantidad", Toast.LENGTH_SHORT).show()
            return
        }

        val cantidad = cantidadText.toIntOrNull() ?: 0
        if (cantidad <= 0) {
            Toast.makeText(this, "La cantidad debe ser mayor a 0", Toast.LENGTH_SHORT).show()
            return
        }

        val productoSeleccionado = productos.find { it.toString() == productoText }
        if (productoSeleccionado == null) {
            Toast.makeText(this, "Producto no válido", Toast.LENGTH_SHORT).show()
            return
        }

        // Verificar si ya existe el plato y sumar cantidad
        val platoExistente =
            platosSeleccionados.find { it.referenciaProducto == productoSeleccionado.id }
        if (platoExistente != null) {
            platoExistente.cantidad += cantidad
        } else {
            val nuevoPlato = Plato(
                referenciaProducto = productoSeleccionado.id,
                nombreProducto = productoSeleccionado.nombre,
                cantidad = cantidad
            )
            platosSeleccionados.add(nuevoPlato)
        }

        platosAdapter.notifyDataSetChanged()
        autoCompleteProducto.text.clear()
        etCantidad.text.clear()
    }

    private fun saveOrder() {
        val mesa = etMesa.text.toString().trim()
        val notas = etNotas.text.toString().trim()

        if (mesa.isEmpty()) {
            Toast.makeText(this, "Ingrese el número de mesa", Toast.LENGTH_SHORT).show()
            return
        }

        if (platosSeleccionados.isEmpty()) {
            Toast.makeText(this, "Agregue al menos un plato", Toast.LENGTH_SHORT).show()
            return
        }

        val order = Order(
            numeroMesa = mesa,
            estado = "EN PROCESO",
            platos = platosSeleccionados.toList(),
            notas = notas
        )

        db.collection("orders")
            .add(order)
            .addOnSuccessListener {
                Toast.makeText(this, "Orden creada exitosamente", Toast.LENGTH_SHORT).show()
                finish()
            }
            .addOnFailureListener {
                Toast.makeText(this, "Error al crear la orden", Toast.LENGTH_SHORT).show()
            }
    }
}