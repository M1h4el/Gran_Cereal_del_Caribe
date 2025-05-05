import { queryDB } from "@/lib/dbUtils";

export async function GET() {
}

export async function POST(request) {
  try {
    const data = await request.json();

    const { amount, details, paymentMethod, paymentType } = data;

    if (!amount || !details || !paymentMethod || !paymentType) {
      return NextResponse.json(
        { message: 'Todos los campos son requeridos.' },
        { status: 400 }
      );
    }

    const newPayment = {
      amount,
      details,
      paymentMethod,
      paymentType,
      createdAt: new Date().toISOString(),
    };

    // const result = queryDB("INSERT ");

    return NextResponse.json({ message: 'Pago registrado', data: newPayment }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error en el servidor', error }, { status: 500 });
  }
}