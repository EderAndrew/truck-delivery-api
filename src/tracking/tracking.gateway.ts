/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class TrackingGateway {
  @WebSocketServer()
  server: Server;

  sendLocation(deliveryId: string, data: any) {
    this.server.to(deliveryId).emit('location', data);
  }

  @SubscribeMessage('join')
  handleJoin(client: any, room: string) {
    client.join(room);
  }
}
