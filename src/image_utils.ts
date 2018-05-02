import { json } from "express";

var parseDbUrl = require("parse-database-url");
var hammingDistance = require("hamming");
var dhashLibrary = require("dhash");
var phashLibrary = require("phash-imagemagick");
const chalk = require('chalk');
const { promisify } = require('util');
const phashGet = promisify(phashLibrary.get);
const dhashGet = promisify(dhashLibrary);
const fs = require('fs');
const imageDownloader = require('image-downloader');
const imageMagick = require('imagemagick');


require('dotenv').config();
const log = require('loglevel');
log.setLevel(process.env.LOG_LEVEL);


export async function generateDHash(imagePath: string, logUrl: string): Promise<number> {
    try {
        return await dhashGet(imagePath);
    } catch (e) {
        log.warn('Could not generate dhash for: ', logUrl, ', ', e);
        return null;
    }
}

export async function generatePHash(imagePath: string, logUrl: string): Promise<number> {
    try {
        return await phashGet(imagePath);
    } catch (e) {
        log.warn('Could not generate phash for: ', logUrl, ', ', e);
        return null;
    }
}

export async function downloadImage(submission): Promise<string> {
    const options = {
        url: await submission.url,
        dest: process.env.DOWNLOAD_DIR
      }

    try {
        const { filename, image } = await imageDownloader.image(options);
        return filename;
    } catch (e) {
        return null;
    }
}

export function deleteImage(imagePath) {
    fs.unlink(imagePath, (e) => {
        if (e) {
            log.error(chalk.red('Failed to delete file: '), imagePath, e);
        }
    });
}

async function trimImage(imagePath: string, logUrl: string) {
    try {
        await promisify(imageMagick.convert)([imagePath, '-trim', imagePath]);
    } catch (e) {
        log.error(chalk.red('Could not trim submission:'), logUrl);
    }
}

export async function isDuplicate(imagePath1: string, imagePath2: string) {
    const dhash1 = await generateDHash(imagePath1, imagePath1);
    const dhash2 = await generateDHash(imagePath2, imagePath2);
    const distance = await hammingDistance(dhash1, dhash2); // hamming threshold
    //const isPHashMatch = phashLibrary.compare(imagePHash, otherSubmission.phash) < 20; // percept. threshold
    return [dhash1, dhash2, distance];
}


module.exports = {
    generateDHash: generateDHash,
    generatePHash: generatePHash,
    isDuplicate: isDuplicate,
    downloadImage: downloadImage,
    deleteImage: deleteImage,
};    
