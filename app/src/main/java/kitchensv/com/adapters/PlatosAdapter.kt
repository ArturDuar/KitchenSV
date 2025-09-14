package kitchensv.com.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import kitchensv.com.R
import kitchensv.com.models.Plato
import kitchensv.com.models.Producto

class PlatosAdapter(
    private val platos: MutableList<Plato>,
    private val onRemove: (Plato) -> Unit
) : RecyclerView.Adapter<PlatosAdapter.PlatoViewHolder>() {

    class PlatoViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val tvNombre: TextView = itemView.findViewById(R.id.tvNombrePlato)
        val tvCantidad: TextView = itemView.findViewById(R.id.tvCantidadPlato)
        val btnRemove: Button = itemView.findViewById(R.id.btnRemovePlato)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PlatoViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_plato, parent, false)
        return PlatoViewHolder(view)
    }

    override fun onBindViewHolder(holder: PlatoViewHolder, position: Int) {
        val plato = platos[position]

        holder.tvNombre.text = plato.nombreProducto
        holder.tvCantidad.text = "Cantidad: ${plato.cantidad}"
        holder.btnRemove.setOnClickListener {
            onRemove(plato)
        }
    }

    override fun getItemCount() = platos.size
}

// Extensión para Producto para usar en AutoCompleteTextView
fun Producto.toString(): String {
    return this.nombre
}