import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  EventDetailDto,
  EventPageDto,
  ListEventsQueryDto,
} from './dto/events.dto';
import { EventsService } from './events.service';

@ApiTags('events')
@ApiCookieAuth()
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOkResponse({ type: EventPageDto })
  @ApiBadRequestResponse({ description: 'Invalid cursor or query parameter' })
  list(@Query() query: ListEventsQueryDto): Promise<EventPageDto> {
    return this.eventsService.list(query);
  }

  @Get(':id')
  @ApiOkResponse({ type: EventDetailDto })
  @ApiNotFoundResponse({ description: 'Event not found or not published' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<EventDetailDto> {
    return this.eventsService.findOne(id);
  }
}
