import express from 'express';
import cors from 'cors';
import multer from 'multer';
import FormData from 'form-data';
import { Readable } from 'stream';
import axios from 'axios';
import OpenAI from 'openai';
import dotenv from 'dotenv';

const getInitialPrompt = (text, formConfig, formData) => {
  return `
  You are provided with (1) text, delimited by tripple angle brackets, \
  (2) a form configuration object, delimited by tripple asterisk signs, \
  and (3) a formData object, delimited by triple hash signs, which contains the already known values. 
  On the basis of the information in the following text and complying with the form configuration object \
  update the values in the formData object and print it out.
  
  You must follow these rules:
  1 - The keys should be in camelCase
  2 - The values should be of the data type specified for that field in the configuration object.
  2 - If the field configuration contains a list of options, choose the most accurate option as the value.
  3 - If the field configuration contains a pattern property, follow the specified pattern.
  4 - If for a particular key, no value was found in the text, keep the original value.
  5 - Print out only the updated formData object. /
  Always write the output of your response in JSON format. /
  Never write additional comments in the output.

  Text:
  <<<${text}>>>

  Form Configuration:
  ***${formConfig}***

  Form Data:
  ###${formData}###
  `;
};

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
    const formConfig = JSON.stringify(req.body.formConfig);
    const formData = JSON.stringify(req.body.formData);

    console.log('text', text);

    const client = new OpenAI({ apiKey: openAI_key });

    const completion = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a form data processor, extracting information from provided text and returning it in the required JSON format.',
        },
        {
          role: 'user',
          content: getInitialPrompt(text, formConfig, formData),
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
