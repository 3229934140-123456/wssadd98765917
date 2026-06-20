import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { AuditProvider } from '@/store/AuditContext';
import './app.scss';

function App(props) {
  useEffect(() => {});

  useDidShow(() => {});

  useDidHide(() => {});

  return (
    <AuditProvider>
      {props.children}
    </AuditProvider>
  );
}

export default App;
