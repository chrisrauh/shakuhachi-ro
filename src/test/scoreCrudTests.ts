import {
  createScore,
  updateScore,
  deleteScore,
  getScore,
  getUserScores,
  getAllScores,
  searchScores
} from '../api/scores';

/**
 * Test suite for Score CRUD operations
 * Open browser console and use these functions to test
 */

// Make functions available globally for console testing
(window as any).testScores = {
  /**
   * Test creating a score
   */
  async testCreate() {
    console.log('Testing createScore...');
    const result = await createScore({
      title: 'Test Score',
      composer: 'Test Composer',
      difficulty: 'beginner',
      tags: ['test', 'example'],
      description: 'A test score for CRUD operations',
      data_format: 'json',
      data: { notes: [] }
    });

    if (result.error) {
      console.error('❌ Create failed:', result.error.message);
    } else {
      console.log('✅ Create successful:', result.score);
      return result.score;
    }
  },

  /**
   * Test updating a score
   */
  async testUpdate(scoreId: string) {
    console.log('Testing updateScore...');
    const result = await updateScore(scoreId, {
      title: 'Updated Test Score',
      description: 'This score has been updated'
    });

    if (result.error) {
      console.error('❌ Update failed:', result.error.message);
    } else {
      console.log('✅ Update successful:', result.score);
      return result.score;
    }
  },

  /**
   * Test getting a single score
   */
  async testGet(scoreId: string) {
    console.log('Testing getScore...');
    const result = await getScore(scoreId);

    if (result.error) {
      console.error('❌ Get failed:', result.error.message);
    } else {
      console.log('✅ Get successful:', result.score);
      return result.score;
    }
  },

  /**
   * Test getting all scores
   */
  async testGetAll() {
    console.log('Testing getAllScores...');
    const result = await getAllScores();

    if (result.error) {
      console.error('❌ GetAll failed:', result.error.message);
    } else {
      console.log(`✅ GetAll successful: ${result.scores.length} scores found`);
      return result.scores;
    }
  },

  /**
   * Test getting user scores
   */
  async testGetUserScores(userId: string) {
    console.log('Testing getUserScores...');
    const result = await getUserScores(userId);

    if (result.error) {
      console.error('❌ GetUserScores failed:', result.error.message);
    } else {
      console.log(
        `✅ GetUserScores successful: ${result.scores.length} scores found`
      );
      return result.scores;
    }
  },

  /**
   * Test searching scores
   */
  async testSearch(query: string) {
    console.log(`Testing searchScores with query: "${query}"...`);
    const result = await searchScores(query);

    if (result.error) {
      console.error('❌ Search failed:', result.error.message);
    } else {
      console.log(
        `✅ Search successful: ${result.scores.length} scores found`
      );
      return result.scores;
    }
  },

  /**
   * Test deleting a score
   */
  async testDelete(scoreId: string) {
    console.log('Testing deleteScore...');
    const result = await deleteScore(scoreId);

    if (result.error) {
      console.error('❌ Delete failed:', result.error.message);
    } else {
      console.log('✅ Delete successful');
    }
  },

  /**
   * Test RLS policies - try to update someone else's score
   */
  async testRLS(scoreId: string) {
    console.log('Testing RLS - attempting to update another user\'s score...');
    const result = await updateScore(scoreId, {
      title: 'Hacked by another user!'
    });

    if (result.error) {
      console.log('✅ RLS working correctly - cannot update other user\'s score');
      console.log('Error message:', result.error.message);
    } else {
      console.error('❌ RLS FAILED - was able to update another user\'s score!');
      console.error('This should not happen!');
    }
  },

  /**
   * Run full test suite
   */
  async runAll() {
    console.log('🧪 Starting CRUD test suite...\n');

    // Test create
    const created = await this.testCreate();
    if (!created) return;

    console.log('\n---\n');

    // Test get
    await this.testGet(created.id);

    console.log('\n---\n');

    // Test update
    await this.testUpdate(created.id);

    console.log('\n---\n');

    // Test getAll
    await this.testGetAll();

    console.log('\n---\n');

    // Test getUserScores
    await this.testGetUserScores(created.user_id);

    console.log('\n---\n');

    // Test search
    await this.testSearch('Test');

    console.log('\n---\n');

    // Test delete
    await this.testDelete(created.id);

    console.log('\n🎉 Test suite complete!');
  }
};

console.log('Score CRUD tests loaded. Use testScores.runAll() to run all tests.');
console.log('Available functions:', Object.keys((window as any).testScores));
