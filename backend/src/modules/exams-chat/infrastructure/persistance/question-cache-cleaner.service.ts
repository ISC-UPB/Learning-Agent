import { Injectable, Logger } from '@nestjs/common'
import type { QuestionRepositoryPort } from '../../domain/ports/question-repository.port'
import { Question } from '../../domain/entities/question.entity'

@Injectable()
export class QuestionCacheCleaner {
  private readonly logger = new Logger(QuestionCacheCleaner.name)
  private readonly ttlDays = 30
  private readonly maxQuestions = 500

  constructor(private readonly repo: QuestionRepositoryPort) {}

  async run(): Promise<void> {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - this.ttlDays)
    try {
      const deleted = await this.repo.deleteOlderThan(cutoff)
      this.logger.log(`Deleted ${deleted} questions by TTL`)
    } catch (err) {
      this.logger.error('Error deleting by TTL', err as any)
    }

    const all = await this.repo.findAll()
    const byCourse = new Map<string, Question[]>()

    for (const q of all) {
      const courseId = (q.metadata && (q.metadata as any).courseId) ?? ''
      const key = courseId
      const arr = byCourse.get(key) ?? []
      arr.push(q)
      byCourse.set(key, arr)
    }

    for (const [courseId, items] of byCourse.entries()) {
      if (!courseId) continue
      if (items.length > this.maxQuestions) {
        try {
          await this.repo.pruneToLimitByCourse(courseId, this.maxQuestions)
          this.logger.log(`Pruned course ${courseId} from ${items.length} to ${this.maxQuestions}`)
        } catch (err) {
          this.logger.error(`Error pruning course ${courseId}`, err as any)
        }
      }
    }
  }
}
