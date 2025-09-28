package kitchensv.com

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kitchensv.com.models.Order
import java.text.SimpleDateFormat
import java.util.Locale

class PaidOrdersActivity : AppCompatActivity() {

    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: PaidOrderAdapter
    private val db = FirebaseFirestore.getInstance()
    private val orders = mutableListOf<Order>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_paid_orders)

        initViews()
        setupRecyclerView()
        loadPaidOrders()
    }

    private fun initViews() {
        recyclerView = findViewById(R.id.recyclerViewPaidOrders)
        supportActionBar?.title = "Órdenes Pagadas"
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
    }

    private fun setupRecyclerView() {
        adapter = PaidOrderAdapter(orders)
        recyclerView.layoutManager = LinearLayoutManager(this)
        recyclerView.adapter = adapter
    }

    private fun loadPaidOrders() {
        db.collection("orders")
            .whereEqualTo("estado", "PAGADA")
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

    override fun onSupportNavigateUp(): Boolean {
        onBackPressed()
        return true
    }
}

class PaidOrderAdapter(
    private val orders: List<Order>
) : RecyclerView.Adapter<PaidOrderAdapter.PaidOrderViewHolder>() {

    class PaidOrderViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val tvMesa: TextView = itemView.findViewById(R.id.tvMesa)
        val tvEstado: TextView = itemView.findViewById(R.id.tvEstado)
        val tvPlatos: TextView = itemView.findViewById(R.id.tvPlatos)
        val tvNotas: TextView = itemView.findViewById(R.id.tvNotas)
        val tvHora: TextView = itemView.findViewById(R.id.tvHora)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PaidOrderViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_paid_order, parent, false)
        return PaidOrderViewHolder(view)
    }

    override fun onBindViewHolder(holder: PaidOrderViewHolder, position: Int) {
        val order = orders[position]

        holder.tvMesa.text = "Mesa: ${order.numeroMesa}"
        holder.tvEstado.text = "Estado: ${order.estado}"
        holder.tvNotas.text = if (order.notas.isNotEmpty()) "Notas: ${order.notas}" else ""

        // Formatear platos
        val platosText = order.platos.joinToString("\n") { plato ->
            "${plato.nombreProducto} x${plato.cantidad}"
        }
        holder.tvPlatos.text = platosText

        // Formatear hora
        order.horaCreacion?.let { timestamp ->
            val sdf = SimpleDateFormat("HH:mm dd/MM", Locale.getDefault())
            holder.tvHora.text = sdf.format(timestamp.toDate())
        }
    }

    override fun getItemCount() = orders.size
}