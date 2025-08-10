import { useParams } from 'react-router-dom';
import { useEffect, useState , useContext } from 'react';
import axios from 'axios';
import { CartContext } from './CartContext';

function ProductDetails() {
    const { id } = useParams();
    const [products, setProducts] = useState([]);
    const { addToCart } = useContext(CartContext);


    useEffect(() => {
        axios.get(`http://localhost:5000/api/products/${id}`)
            .then(res => {
                const data = Array.isArray(res.data) ? res.data : [res.data];
                setProducts(data);
            })
            .catch(err => console.error(err));
    }, [id]);

    return (
        <><div className="product-detail-banner d-flex align-items-center justify-content-center mb-5">
            <img src='/assets/img/details.png' className="img-fluid w-100"></img>
        </div>
        <div className="product-detail-container">
                {products.map(product => (
                    <div key={product.id} className="product-detail-card">
                        <div className="product-detail-img-box">
                            <img
                                src={`/${product.img}`}
                                alt={product.name}
                                className="product-detail-img" />
                        </div>
                        <div className="product-detail-info">
                            <h1 className="product-title">{product.name}</h1>
                            <p className="product-price-2">From {product.price.toLocaleString()} $</p>
                            <p className="product-desc">{product.description}</p>
                            <p className="product-stock">Stock: {product.stock}</p>
                            <button className="buy-btn"  onClick={() => addToCart(product)}>BUY NOW</button>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}

export default ProductDetails;
