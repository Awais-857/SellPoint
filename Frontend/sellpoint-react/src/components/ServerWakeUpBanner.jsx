// src/components/ServerWakeUpBanner.jsx
import React, { useEffect, useState } from 'react';
import styles from './ServerWakeUpBanner.module.css';

function ServerWakeUpBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const show = () => setVisible(true);
        const hide = () => setVisible(false);

        window.addEventListener('server-slow-start', show);
        window.addEventListener('server-slow-end', hide);

        return () => {
            window.removeEventListener('server-slow-start', show);
            window.removeEventListener('server-slow-end', hide);
        };
    }, []);

    if (!visible) return null;

    return (
        <div className={styles['wakeup-banner']}>
            <div className={styles['wakeup-spinner']}></div>
            <div className={styles['wakeup-text']}>
                <strong>Starting up our servers…</strong>
                <span>This may take up to a minute the first time. Thanks for your patience!</span>
            </div>
        </div>
    );
}

export default ServerWakeUpBanner;