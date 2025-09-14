package kitchensv.com.models

import com.google.firebase.Timestamp
import com.google.firebase.firestore.ServerTimestamp

data class Order(
    var id: String = "",
    var numeroMesa: String = "",
    var estado: String = "EN PROCESO", // EN PROCESO, ENTREGADA, PAGADA
    var platos: List<Plato> = emptyList(),
    var notas: String = "",
    @ServerTimestamp var horaCreacion: Timestamp? = null
)

data class Plato(
    var referenciaProducto: String = "", // ID del producto en Firebase
    var nombreProducto: String = "", // Nombre para mostrar
    var cantidad: Int = 1
)

data class Producto(
    var id: String = "",
    var nombre: String = "",
    var precio: Double = 0.0,
    var categoria: String = "",
    var disponible: Boolean = true
) {
    override fun toString(): String {
        return nombre
    }
}