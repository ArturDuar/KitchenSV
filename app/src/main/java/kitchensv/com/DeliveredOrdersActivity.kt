package kitchensv.com

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import kitchensv.com.adapters.DeliveredOrderAdapter
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kitchensv.com.models.Order

class DeliveredOrdersActivity : AppCompatActivity() {

    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: DeliveredOrderAdapter
    private val db = FirebaseFirestore.getInstance()
    private val orders = mutableListOf<Order>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_delivered_orders)

        initViews()
        setupRecyclerView()
        loadDeliveredOrders()
    }

    private fun initViews() {
        recyclerView = findViewById(R.id.recyclerViewDeliveredOrders)
        supportActionBar?.title = "Órdenes Entregadas"
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
    }

    private fun setupRecyclerView() {
        adapter = DeliveredOrderAdapter(orders) { order ->
            markAsPaid(order)
        }
        recyclerView.layoutManager = LinearLayoutManager(this)
        recyclerView.adapter = adapter
    }

    private fun loadDeliveredOrders() {
        db.collection("orders")
            .whereEqualTo("estado", "ENTREGADA")
            .orderBy("horaCreacion", Query.Direction.DESCENDING)
            .addSnapshotListener { snapshots, e ->
                if (e != null) {
                    Toast.makeText(this, "Error al cargar órdenes", Toast.LENGTH_SHORT).show()
                    return@addSnapshotListener
                }

                orders.clear()
                snapshots?.documents?.forEach { document ->
                    val order = document.toObject(Order::class.java)
                    order?.let {
                        it.id = document.id
                        orders.add(it)
                    }
                }
                adapter.notifyDataSetChanged()
            }
    }

    private fun markAsPaid(order: Order) {
        db.collection("orders").document(order.id)
            .update("estado", "PAGADA")
            .addOnSuccessListener {
                Toast.makeText(this, "Orden marcada como pagada", Toast.LENGTH_SHORT).show()
            }
            .addOnFailureListener {
                Toast.makeText(this, "Error al actualizar orden", Toast.LENGTH_SHORT).show()
            }
    }

    override fun onSupportNavigateUp(): Boolean {
        onBackPressed()
        return true
    }
}