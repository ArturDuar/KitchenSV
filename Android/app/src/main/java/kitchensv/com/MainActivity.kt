package kitchensv.com

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import kitchensv.com.models.Order
import kitchensv.com.adapters.OrderAdapter
import com.google.android.material.floatingactionbutton.FloatingActionButton
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query

class MainActivity : AppCompatActivity() {

    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: OrderAdapter
    private lateinit var fab: FloatingActionButton
    private val db = FirebaseFirestore.getInstance()
    private val orders = mutableListOf<Order>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        initViews()
        setupRecyclerView()
        loadOrdersInProcess()
        setupFab()
    }

    private fun initViews() {
        recyclerView = findViewById(R.id.recyclerViewOrders)
        fab = findViewById(R.id.fabAddOrder)
    }

    private fun setupRecyclerView() {
        adapter = OrderAdapter(orders) { order ->
            markAsDelivered(order)
        }
        recyclerView.layoutManager = LinearLayoutManager(this)
        recyclerView.adapter = adapter
    }

    private fun loadOrdersInProcess() {
        db.collection("orders")
            .whereEqualTo("estado", "EN PROCESO")
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

    private fun markAsDelivered(order: Order) {
        db.collection("orders").document(order.id)
            .update("estado", "ENTREGADA")
            .addOnSuccessListener {
                Toast.makeText(this, "Orden marcada como entregada", Toast.LENGTH_SHORT).show()
            }
            .addOnFailureListener {
                Toast.makeText(this, "Error al actualizar orden", Toast.LENGTH_SHORT).show()
            }
    }

    private fun setupFab() {
        fab.setOnClickListener {
            startActivity(Intent(this, CreateOrderActivity::class.java))
        }

        // Navegación a otras pantallas
        findViewById<View>(R.id.btnDeliveredOrders).setOnClickListener {
            startActivity(Intent(this, DeliveredOrdersActivity::class.java))
        }

        findViewById<View>(R.id.btnPaidOrders).setOnClickListener {
            startActivity(Intent(this, PaidOrdersActivity::class.java))
        }
    }
}