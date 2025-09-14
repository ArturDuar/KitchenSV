package kitchensv.com.adapters

import android.app.AlertDialog
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import kitchensv.com.R
import kitchensv.com.models.Order
import java.text.SimpleDateFormat
import java.util.*

class DeliveredOrderAdapter(
    private val orders: List<Order>,
    private val onMarkAsPaid: (Order) -> Unit
) : RecyclerView.Adapter<DeliveredOrderAdapter.DeliveredOrderViewHolder>() {

    class DeliveredOrderViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val tvMesa: TextView = itemView.findViewById(R.id.tvMesa)
        val tvEstado: TextView = itemView.findViewById(R.id.tvEstado)
        val tvPlatos: TextView = itemView.findViewById(R.id.tvPlatos)
        val tvNotas: TextView = itemView.findViewById(R.id.tvNotas)
        val tvHora: TextView = itemView.findViewById(R.id.tvHora)
        val btnMarkAsPaid: Button = itemView.findViewById(R.id.btnMarkAsPaid)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): DeliveredOrderViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_delivered_order, parent, false)
        return DeliveredOrderViewHolder(view)
    }

    override fun onBindViewHolder(holder: DeliveredOrderViewHolder, position: Int) {
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

        holder.btnMarkAsPaid.setOnClickListener {
            AlertDialog.Builder(holder.itemView.context)
                .setTitle("Confirmar cambio de estado")
                .setMessage("¿Estás seguro de que deseas marcar esta orden como pagada?")
                .setPositiveButton("Sí") { dialog, _ ->
                    onMarkAsPaid(order)
                    dialog.dismiss()
                }
                .setNegativeButton("No") { dialog, _ ->
                    dialog.dismiss()
                }
                .show()
        }
    }

    override fun getItemCount() = orders.size
}