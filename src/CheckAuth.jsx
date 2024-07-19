const checkAuth = async () => {
    try {
      const response = await fetch('/auth-status', {
        method: 'GET',
        credentials: 'include',
      });
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking auth:', error);
      return false;
    }
};

export default checkAuth;

