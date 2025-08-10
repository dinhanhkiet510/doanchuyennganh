import { useParams } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { CartContext } from './CartContext';


function Products() {
    const { categoryId } = useParams();
    const [products, setProducts] = useState([]);
    const { addToCart } = useContext(CartContext);

    useEffect(() => {
        // Gọi API theo categoryId
        axios.get(`http://localhost:5000/products/category/${categoryId}`)
            .then(res => setProducts(res.data))
            .catch(err => console.error(err));
    }, [categoryId]);

     // Xử lý banner dựa trên category
    const getBannerImage = () => {
        switch (categoryId) {
        case "1":
            return "/assets/img/amps-all_plp-desktop.png "; // Đường dẫn trực tiếp từ thư mục public
        case "2":
            return "/assets/img/speakers-all_plp-desktop.png "; // Đường dẫn trực tiếp từ thư mục public
        case "3":
            return "/assets/img/headband_headphones_desktop-banner.png"; // Đường dẫn trực tiếp từ thư mục public
        }
    };

    const getTextBanner = () => {
        switch(categoryId) {
            case "1":
                return "AMPS"; // Đường dẫn trực tiếp từ thư mục public
            case "2":
                return "SPEAKERS"; // Đường dẫn trực tiếp từ thư mục public
            case "3":
                return "HEADPHONES"; // Đường dẫn trực tiếp từ thư mục public
            }
    }

    const getTitleBanner = () => {
        switch(categoryId) {
            case "1":
                return "POWERING YOUR SOUND, ELEVATING YOUR PERFORMANCE."; // Đường dẫn trực tiếp từ thư mục public
            case "2":
                return "ENJOY MARSHALL SOUND AT HOME OR ON THE ROAD"; // Đường dẫn trực tiếp từ thư mục public
            case "3":
                return "EXPLORE THE DIVERSE WORLD OF MARSHALL HEADPHONES TO FIND YOUR IDEAL MATCH."; // Đường dẫn trực tiếp từ thư mục public
            }
    }

    const getDescripBanner = () => {
        switch(categoryId) {
            case "1":
                return "Your amplifier is the heartbeat of your performance, boosting your input and enhancing sound quality and volume. With various types and configurations available – Marshall caters to a diverse range of needs, from home practice to large venue performances."; // Đường dẫn trực tiếp từ thư mục public
            case "2":
                return "Experience Marshall signature sound in the comfort of your home or outdoors on the road. Say hello to seamless connection and hours of uninterrupted wireless listening."; // Đường dẫn trực tiếp từ thư mục public
            case "3":
                return "Whether you lean towards wireless convenience, traditional wired setups, or immersive noise cancellation, discover the perfect pair that suits your preferences. Your music, your way."; // Đường dẫn trực tiếp từ thư mục public
            }
    }
    
    return (
    <>
        <div className="speakerbanner d-flex align-items-center justify-content-center mb-5">
            <img
                src={getBannerImage()}
                alt="banner"
                className="img-fluid w-100" />
            <p className="text-banner">
                {getTextBanner()}
            </p>
        </div>
        <div className="product-grid-container">
            <h2 className="product-title">{getTitleBanner()}</h2>
            <p className="product-subtitle">
                {getDescripBanner()}
            </p>
            <p className="product-count">{products.length} ITEMS</p>
            <div className="product-grid">
                {products.map(product => (
                    <div className="product-item" key={product.id}>
                        <Link to={`/products/${product.id}`} >
                            <img src={`/${product.img}`} alt={product.name} className="product-img" />
                            <div className="overlay">
                            <span className="add-to-cart">Add to Cart</span>
                            </div>
                        </Link>
                        <div className="product-info">
                            <h5 className="product-name">{product.name}</h5>
                            <p className="product-price">FROM {product.price} VND</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

    </>
    );
}

export default Products;
