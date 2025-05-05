const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const fetchData = async (endpoint, method, body = null) => {

  console.log("12314123123123", API_URL);
  const headers = {
    'Content-Type': 'application/json',
  };

  const requestOptions = {
    method: typeof method === 'string' ? method.toUpperCase() : 'GET',
    headers: headers,
  };

  if (body) {
    requestOptions.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${API_URL}/${endpoint}`, requestOptions);

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Error al obtener datos');
    }

    return await res.json();
  } catch (error) {
    console.error('Error en fetchData:', error.message);
    throw error;
  }
};
