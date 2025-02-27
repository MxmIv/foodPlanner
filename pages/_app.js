// pages/_app.js
import '../styles/globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import { MealProvider } from '../contexts/MealContext';

function MyApp({ Component, pageProps }) {
    return (
        <AuthProvider>
            <MealProvider>
                <Component {...pageProps} />
            </MealProvider>
        </AuthProvider>
    );
}

export default MyApp;
