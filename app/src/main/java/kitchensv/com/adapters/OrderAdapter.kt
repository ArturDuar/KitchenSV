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

class OrderAdapter(
    private val orders: List<Order>,
    private val onDelivered: (Order) -> Unit
) : RecyclerView.Adapter<OrderAdapter.OrderViewHolder>() {

    class OrderViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val tvMesa: TextView = itemView.findViewById(R.id.tvMesa)
        val tvEstado: TextView = itemView.findViewById(R.id.tvEstado)
        val tvPlatos: TextView = itemView.findViewById(R.id.tvPlatos)
        val tvNotas: TextView = itemView.findViewById(R.id.tvNotas)
        val tvHora: TextView = itemView.findViewById(R.id.tvHora)
        val btnAction: Button = itemView.findViewById(R.id.btnAction)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): OrderViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_order, parent, false)
        return OrderViewHolder(view)
    }

    override fun onBindViewHolder(holder: OrderViewHolder, position: Int) {
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

        // Configurar botón según el estado
        when (order.estado) {
            "EN PROCESO" -> {
                holder.btnAction.text = "Marcar como Entregada"
                holder.btnAction.setOnClickListener {
                    AlertDialog.Builder(holder.itemView.context)
                        .setTitle("Confirmar Acción")
                        .setMessage("¿Estás seguro de que quieres marcar esta orden como entregada?")
                        .setPositiveButton("Sí") { dialog, _ ->
                            onDelivered(order)
                            dialog.dismiss()
                        }
                        .setNegativeButton("No") { dialog, _ ->
                            dialog.dismiss()
                        }
                        .show()
                }
                holder.btnAction.visibility = View.VISIBLE
            }
            else -> {
                holder.btnAction.visibility = View.GONE
            }
        }
    }

    override fun getItemCount() = orders.size
}