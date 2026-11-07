import { handleTrpcRequest } from '@/server/http';

// Queries arrive as GET, mutations as POST.
const handler = (req: Request) => handleTrpcRequest(req);

export { handler as GET, handler as POST };
