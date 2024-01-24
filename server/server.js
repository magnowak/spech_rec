import express from 'express';
import cors from 'cors';
import multer from 'multer';
import FormData from 'form-data';
import { Readable } from 'stream';
import axios from 'axios';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();
const openAI_key = process.env.OPENAI_API_KEY;

const upload = multer();

const bufferToStream = (buffer) => {
  return Readable.from(buffer);
};

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to the Speech-to-Text API!');
});

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    const audioFile = req.file;
    if (!audioFile) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const formData = new FormData();
    const audioStream = bufferToStream(audioFile.buffer);
    formData.append('file', audioStream, { filename: 'audio.mp3', contentType: audioFile.mimetype });
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'json');

    const config = {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
        Authorization: `Bearer ${openAI_key}`,
      },
    };

    const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, config);
    console.log('OpenAI API Response:', response.data);

    const transcription = response.data.text;
    res.json({ transcription });
  } catch (error) {
    console.error('Error transcribing audio:', error.message);
    res.status(500).json({ error: 'Error transcribing audio', details: error.message });
  }
});

app.post('/api/fillForm', async (req, res) => {
  try {
    const text = JSON.stringify(req.body.text);
    const formData = JSON.stringify(req.body.formData);

    console.log('text', text);

    const client = new OpenAI({ apiKey: openAI_key });

    const completion = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.',
        },
        {
          role: 'user',
          content: `From text: ${text} generate json with name, address, email, gender, age group, whether the user accepts terms and consitions and whether they enable tracking.
          For age value, choose from the following options: '<20' for age values below 20, '20-60' for age values between 20 and 60 and '>60' for age values above 60.
          Returned JSON should have the following structure: ${formData}
          If for a particular key, no value was found in the text, keep the original value.`,
        },
      ],
    });

    res.json({ completion });
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Error completing form', details: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
